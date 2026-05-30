<?php session_start(); ?>
<!DOCTYPE html>
<html lang="pt_br">

<head>
     <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
     <meta name="description" content="Profsa Informática - Gerenciamento de Colaboradores" />
     <meta name="author" content="Paulo Rogério Souza" />
     <meta name="viewport" content="width=device-width, initial-scale=1" />

     <link href="https://fonts.googleapis.com/css?family=Lato:300,400" rel="stylesheet" type="text/css" />
     <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400" rel="stylesheet" type="text/css" />

     <link href="//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">

     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.2/animate.css">

     <link rel="shortcut icon" href="https://www.profsa.com.br/pallas56/img/logo-00.png" />

     <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>

     <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

     <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
          integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
     <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"
          integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous">
     </script>
     <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"
          integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous">
     </script>

     <script type="text/javascript" language="javascript"
          src="https://cdn.datatables.net/1.10.15/js/jquery.dataTables.min.js"></script>
     <link href="https://cdn.datatables.net/1.10.15/css/jquery.dataTables.min.css" rel="stylesheet" type="text/css" />

     <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
     <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>

     <link href="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote.min.css" rel="stylesheet">
     <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote.min.js"></script>
     <script src="js/summernote-pt-BR.js"></script>

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>Quadro - Gerenciamento de Colaboradores</title>
</head>

<script>
$(document).ready(function() {
     if (localStorage.qua_a == undefined) {
          $('#tel_c').hide();
          localStorage.setItem('qua_a', 1);
     }

     $('#summernote').summernote({
          lang: 'pt-BR' // default: 'en-US'
     });

     $('#tab-0').DataTable({
          "pageLength": 50,
          "aaSorting": [
               [4, 'asc'],
               [2, 'asc']
          ],
          "language": {
               "lengthMenu": "Demonstrar _MENU_ linhas por páginas",
               "zeroRecords": "Não existe registros a demonstrar ...",
               "info": "Mostrada página _PAGE_ de _PAGES_",
               "infoEmpty": "Sem registros de funções ...",
               "sSearch": "Buscar:",
               "infoFiltered": "(Consulta de _TOTAL_/_MAX_ total de linhas)",
               "oPaginate": {
                    sFirst: "Primeiro",
                    sLast: "Último",
                    sNext: "Próximo",
                    sPrevious: "Anterior"
               }
          }
     });

     $("#mos_t").click(function() {
          $('#tel_c').fadeToggle();
     });

     $("#sal_a").click(function() {
          $('#txt_a').val($('#summernote').summernote('code'));
          var dad = $('#frmTelMan').serialize();
          $.post("ajax/avi-gra-dados.php", dad, function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#des').val('');
                         $('#sta').val(0);
                         $('#set').val(0);
                         $('#fun').val(0);
                         $('#col').val(0);
                         $('#ope_r').val(1);
                         $('#cod_r').val(0);
                         $('#txt_a').val('');
                         $("#tod").prop("checked", false);
                         $('#sal_a').text("Salvar");
                         $('#frmTelMan').submit();
                    }
               }, "json")
               .done(function() {

               }, "json")
               .fail(function(data) {
                    console.log(JSON.stringify(data));
                    alert("Erro ocorrido na gravação de dados do registro do aviso !");
               }, "json");
     });

     $("form").on("click", ".aviso", function() {
          var ope = $(this).attr("ope");
          var cod = $(this).attr("cod");
          $('#ope_r').val(ope);
          $('#cod_r').val(cod);
          $.getJSON("ajax/avi-car-dados.php", {
                    tip: 1,
                    ope: ope,
                    cod: cod
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#cod').val(data.cod);
                         $('#sta').val(data.sta);
                         $('#des').val(data.des);
                         $('#set').val(data.set);
                         $('#fun').val(data.fun);
                         $('#col').val(data.col);
                         $('#txt_a').val(data.txt);
                         if (data.tod == 1) {
                              $("#tod").prop("checked", true);
                         } else {
                              $("#tod").prop("checked", false);
                         }
                         $('#summernote').summernote('code', data.txt);
                         if (ope == 2) {
                              $('#sal_a').text("Salvar");
                         } else {
                              $('#sal_a').text("Deletar");
                         }
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados do quadro de aviso");
               });
     });

     $("form").on("click", ".texto", function() {
          var cod = $(this).attr("cod");
          $.getJSON("ajax/avi-car-texto.php", {
                    cod: cod
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#qua_a').html(data.txt);
                         $('#tel-avi').text('Quadro de Avisos - ' + data.dat);
                         $('#qua-avi').modal('show');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de texto do quadro");
               });
     });

     $("#pes_f").click(function() {
          $('#frmTelMan').submit();
     });

     $(window).scroll(function() {
          if ($(this).scrollTop() > 100) {
               $(".subir").fadeIn(500);
          } else {
               $(".subir").fadeOut(250);
          }
     });

     $(".subir").click(function() {
          $topo = $("#box00").offset().top;
          $('html, body').animate({
               scrollTop: $topo
          }, 1500);
     });

});
</script>

<?php
     $ret = 0; 
     $per = "";
     $del = "";
     $bot = "Salvar";
     include_once "dados.php";
     include_once "profsa.php";
     $_SESSION['wrkendser'] = getenv("REMOTE_ADDR");
     date_default_timezone_set("America/Sao_Paulo");

     if (isset($_SESSION['wrkopereg']) == false) { $_SESSION['wrkopereg'] = 0; }
     if (isset($_SESSION['wrkcodreg']) == false) { $_SESSION['wrkcodreg'] = 0; }
     if (isset($_REQUEST['ope']) == true) { $_SESSION['wrkopereg'] = $_REQUEST['ope']; }
     if (isset($_REQUEST['cod']) == true) { $_SESSION['wrkcodreg'] = $_REQUEST['cod']; }

     if ($_SESSION['wrkopereg'] == 1) { 
          $_SESSION['wrkcodreg'] = ultimo_cod();
     }
     if ($_SESSION['wrkopereg'] == 3) { 
          $bot = 'Deletar'; 
          $del = "cor-2";
          $per = ' onclick="return confirm(\'Confirma exclusão deste aviso informado em tela ?\')" ';
     }  

     if ($_SESSION['wrkopereg'] == 2 || $_SESSION['wrkopereg'] == 3) {
          if (isset($_REQUEST['salvar']) == false) { 
               $cha = $_SESSION['wrkcodreg']; $_SESSION['wrknumcha'] = $_SESSION['wrkcodreg']; 
               $ret = ler_quadro($_SESSION['wrkcodreg']); 
          }
     }

?>

<body id="box00">
     <div class="container-fluid">
          <div class="row">
               <div id="men-2" class="cab-a col-md-2">
                    <?php include_once "cabecalho-2.php"; ?>
               </div>
               <div class="col-md-10">
                    <br />
                    <div class="row">
                         <div class="col-md-10">
                              <h3 class="cor-4"><strong>Manutenção de Avisos</strong></h3>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="mos_t" href="#"
                                   title="Mostra e esconde a página detalhada com os dados de aviso para edição.">
                                   <i class="fa fa-eye fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a href="man-quadro.php?ope=1&cod=0"
                                   title="Abre página para adicionar (criar) mais um aviso dentro do sistema.">
                                   <i class="fa fa-plus-circle fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                    </div>
                    <br />
                    <form id="frmTelMan" name="frmTelMan" action="man-quadro.php" method="POST">
                         <div class="qua-2" id="tel_c">
                              <div class="row">
                                   <div class="col-md-2">
                                        <label>Número</label>
                                        <input type="text" class="form-control text-center" maxlength="6" id="cod"
                                             name="cod" value="<?php echo $_SESSION['wrkcodreg']; ?>" disabled />
                                   </div>
                                   <div class="col-md-6">
                                        <label>Título para o Aviso</label>
                                        <input type="text" class="form-control" maxlength="50" id="des" name="des"
                                             value="<?php echo (isset($_REQUEST['des']) == false ? "" : $_REQUEST['des']); ?>"
                                             required />
                                   </div>
                                   <div class="col-md-2 text-center"><br />
                                        <input type="checkbox" id="tod" name="tod" value="1"
                                             <?php echo (isset($_REQUEST['tod']) == false ? "" : 'checked'); ?> />
                                        <span>&nbsp;Para Todos</span>
                                   </div>
                                   <div class="col-md-2">
                                        <label>Status</label>
                                        <select id="sta" name="sta" class="form-control">
                                             <option value="0"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 0 ? '' : 'selected="selected"'); ?>>
                                                  Normal
                                             </option>
                                             <option value="1"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 1 ? '' : 'selected="selected"'); ?>>
                                                  Bloqueado</option>
                                             <option value="2"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 2 ? '' : 'selected="selected"'); ?>>
                                                  Suspenso</option>
                                             <option value="3"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 3 ? '' : 'selected="selected"'); ?>>
                                                  Cancelado</option>
                                        </select>
                                   </div>
                              </div>
                              <div class="row">
                                   <div class="col-md-4">
                                        <label>Setor</label>
                                        <select id="set" name="set" class="form-control">
                                             <?php $ret = carrega_set(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-4">
                                        <label>Função</label>
                                        <select id="fun" name="fun" class="form-control">
                                             <?php $ret = carrega_fun(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-4">
                                        <label>Nome do Funcionário</label>
                                        <select id="col" name="col" class="form-control">
                                             <?php $ret = carrega_col(); ?>
                                        </select>
                                   </div>
                              </div>
                              <div class="row">
                                   <div class="col-md-12">
                                        <label>Descrição detalhada do Aviso</label>
                                        <div class="fun-4" id="summernote"></div>
                                   </div>
                              </div>
                              <br />
                              <div class="row text-center">
                                   <div class="col-md-5"></div>
                                   <div class="col-md-2">
                                        <button type="button" id="sal_a" name="sal_a" <?php echo $per; ?>
                                             class="bot-1 <?php echo $del; ?>"><?php echo $bot; ?></button>
                                   </div>
                                   <div class="col-md-3"></div>
                              </div>
                              <br />
                              <input type="hidden" name="txt_a" id="txt_a" value="" />
                              <input type="hidden" name="ope_r" id="ope_r"
                                   value="<?php echo $_SESSION['wrkopereg']; ?>" />
                              <input type="hidden" name="cod_r" id="cod_r"
                                   value="<?php echo $_SESSION['wrkcodreg']; ?>" />
                         </div>
                         <br />
                         <div class="row qua-4">
                              <div class="col-md-1"></div>
                              <div class="col-md-3">
                                   <label>Local</label>
                                   <select id="loc_p" name="loc_p" class="form-control">
                                        <?php $ret = carrega_loc(); ?>
                                   </select>
                              </div>
                              <div class="col-md-3">
                                   <label>Setor</label>
                                   <select id="set_p" name="set_p" class="form-control">
                                        <?php $ret = carrega_set(); ?>
                                   </select>
                              </div>
                              <div class="col-md-3">
                                   <label>Função</label>
                                   <select id="fun_p" name="fun_p" class="form-control">
                                        <?php $ret = carrega_fun(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2 text-center"><br />
                                   <button type="button" class="bot-2" id="pes_f" name="pes_f">
                                        <i class="fa fa-search fa-3x" aria-hidden="true"></i>
                                   </button>
                              </div>
                         </div>
                         <br />
                         <div class="container-fluid">
                              <div class="row">
                                   <div class="tab-1 table-responsive">
                                        <table id="tab-0" class="table table-sm table-striped">
                                             <thead>
                                                  <tr>
                                                       <th width="5%" class="text-center">Alterar</th>
                                                       <th width="5%" class="text-center">Excluir</th>
                                                       <th width="5%" class="text-center">Código</th>
                                                       <th>Status</th>
                                                       <th>Título para o Aviso</th>
                                                       <th>Local</th>
                                                       <th>Setor</th>
                                                       <th>Função</th>
                                                       <th>Funcionário</th>
                                                       <th class="text-center">Inclusão</th>
                                                       <th class="text-center">Alteração</th>
                                                       <th class="text-center">Visualizar</th>
                                                  </tr>
                                             </thead>
                                             <tbody>
                                                  <?php $ret = carrega_qua();  ?>
                                             </tbody>
                                        </table>
                                   </div>
                              </div>
                         </div>
                    </form>
               </div>
          </div>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="modal fade" id="qua-avi" tabindex="-1" role="dialog" aria-labelledby="tel-avi" aria-hidden="true"
               data-backdrop="true">
               <div class="modal-dialog modal-xl" role="document">
                    <!-- modal-sm modal-lg modal-xl -->
                    <form id="frmMosFot" name="frmMosFot" action="man-quadro.php" method="POST">
                         <div class="modal-content">
                              <div class="modal-header bg-primary text-white">
                                   <h5 class="modal-title" id="tel-avi">Quadro de Avisos</h5>
                                   <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                        <span aria-hidden="true">&times;</span>
                                   </button>
                              </div>
                              <div class="modal-body">
                                   <div class="form-row text-center">
                                        <div class="col-md-12">
                                             <div id="qua_a"></div>
                                        </div>
                                   </div>
                                   <br />
                              </div>
                              <div class="modal-footer">
                                   <button type="button" id="clo" name="close" class="btn btn-outline-danger"
                                        data-dismiss="modal">Fechar</button>
                              </div>
                         </div>
                    </form>
               </div>
          </div>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="row">
               <img class="subir" src="img/subir.png" />
          </div>
     </div>
</body>

<?php
function ultimo_cod() {
     $cod = 1;
     include_once "dados.php";
     $nro = acessa_reg('Select idquadro from tb_quadro order by idquadro desc Limit 1', $reg);
     if ($nro == 1) {
          $cod = $reg['idquadro'] + 1;
     }        
     return $cod;
}

function ler_quadro(&$cha) {
     include_once "dados.php";
     $nro = acessa_reg('Select * from tb_quadro where idquadro = ' . $cha, $reg);
     if ($nro == 0 || $reg == false) {
          echo '<script>alert("Código do aviso informado não cadastrado");</script>';
          $nro = 1;
     } else {
          $_REQUEST['sta'] = $reg['quastatus'];
          $_REQUEST['des'] = $reg['quadescricao'];
          if ($reg['doctodos'] == 1) { $_REQUEST['tod'] = $reg['doctodos'];}
     }
     return $cha;
}

function carrega_col() {
     $sta = 0;
     include_once "dados.php";    
     $col = (isset($_REQUEST['col']) == false ? "" : $_REQUEST['col']);
     echo '<option value="0" selected="selected">Selecione funcionário desejado ...</option>';
     $com = "Select idfuncionario, funnome from tb_funcionario order by funnome, idfuncionario";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['idfuncionario'] != $col) {
               echo  '<option value ="' . $lin['idfuncionario'] . '">' . $lin['funnome'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['idfuncionario'] . '" selected="selected">' . $lin['funnome'] . '</option>';
          }
     }
     return $sta;
}

function carrega_loc() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione local desejado ...</option>';
     $com = "Select idlocal, locrazao from tb_local where locstatus = 0 order by locrazao, idlocal";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['idlocal'] . '">' . $lin['locrazao'] . '</option>'; 
     }
     return $sta;
}

function carrega_set() {
     $sta = 0;
     include_once "dados.php";    
     $set = (isset($_REQUEST['set']) == false ? "" : $_REQUEST['set']);
     echo '<option value="0" selected="selected">Selecione setor desejado ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 2 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['iddados'] != $set) {
               echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['iddados'] . '" selected="selected">' . $lin['daddescricao'] . '</option>';
          }
     }
     return $sta;
}

function carrega_fun() {
     $sta = 0;
     include_once "dados.php";    
     $fun = (isset($_REQUEST['fun']) == false ? "" : $_REQUEST['fun']);
     echo '<option value="0" selected="selected">Selecione função desejada ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 1 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['iddados'] != $fun) {
               echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['iddados'] . '" selected="selected">' . $lin['daddescricao'] . '</option>';
          }
     }
     return $sta;
}

function carrega_qua() {
     $ret = 0;
     include_once "dados.php";
     $com = "Select Q.*, F.funlocal from (tb_quadro Q left join tb_funcionario F on Q.quafuncionario = F.idfuncionario) where idquadro > 0 ";
     if (isset($_REQUEST['set_p']) == true) {
          if ($_REQUEST['loc_p'] != 0) {$com .= " and funlocal = " . $_REQUEST['loc_p'];}          
          if ($_REQUEST['set_p'] != 0) {$com .= " and quasetor = " . $_REQUEST['set_p'];}
          if ($_REQUEST['fun_p'] != 0) {$com .= " and quafuncao = " . $_REQUEST['fun_p'];}
     }
     $com .= " order by quatitulo, idquadro";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          $txt =  '<tr>';
          $txt .= '<td class="text-center"><a class="aviso" href="#" ope=2 cod=' . $lin['idquadro'] . ' title="Efetua alteração do registro informado na linha"><i class="large material-icons">healing</i></a></td>';
          $txt .= '<td class="text-center"><a class="aviso" href="#" ope=3 cod=' . $lin['idquadro'] . ' title="Efetua alteração do registro informado na linha"><i class="cor-1 large material-icons">delete_forever</i></a></td>';
          $txt .= '<td class="text-center">' . $lin['idquadro'] . '</td>';
          if ($lin['quastatus'] == 0) {$txt .= "<td>" . "Normal" . "</td>";}
          if ($lin['quastatus'] == 1) {$txt .= "<td>" . "Bloqueado" . "</td>";}
          if ($lin['quastatus'] == 2) {$txt .= "<td>" . "Suspenso" . "</td>";}
          if ($lin['quastatus'] == 3) {$txt .= "<td>" . "Cancelado" . "</td>";}
          $txt .= '<td>' . $lin['quatitulo'] . '</td>';
          $txt .= '<td>' . retorna_dad('locfantasia', 'tb_local', 'idlocal', $lin['funlocal']) . '</td>';
          $txt .= '<td>' . retorna_inf('daddescricao', 2, 'iddados', $lin['quasetor']) . '</td>';
          $txt .= '<td>' . retorna_inf('daddescricao', 1, 'iddados', $lin['quafuncao']) . '</td>';
          $txt .= '<td>' . retorna_dad('funnome', 'tb_funcionario', 'idfuncionario', $lin['quafuncionario']) . '</td>';
          $txt .= '<td class="text-center">' . date('d/m/Y H:i:s', strtotime($lin['datinc'])) . '</td>';
          if ($lin['datalt']  == null) {
               $txt .= '<td class="text-center">' . '' . '</td>';
          } else {
               $txt .= '<td class="text-center">' . date('d/m/Y H:i:s', strtotime($lin['datalt'])) . '</td>';
          }
          $txt .= '<td class="text-center">' . '<i class="texto cur-1 fa fa-search fa-2x" aria-hidden="true" cod=' . $lin['idquadro'] . '></i>' . '</td>';
          $txt .= "</tr>";
          echo $txt;
     }
     return $ret;
}

?>

</html>