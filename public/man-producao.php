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

     <script type="text/javascript" src="js/jquery.mask.min.js"></script>

     <script type="text/javascript" src="js/datepicker-pt-BR.js"></script>

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>Produtividade - Gerenciamento de Colaboradores</title>
</head>

<script>
$(function() {
     $("#qtd").mask("000.000");
     $("#dat").mask("00/00/0000");
     $("#mes_p").mask("00/0000");
     $("#dat").datepicker($.datepicker.regional["pt-BR"]);
});

$(document).ready(function() {
     if (localStorage.pro_f == undefined) {
          $('#tel_c').hide();
          localStorage.setItem('pro_f', 1);
     }

     $('#tab-0').DataTable({
          "pageLength": 50,
          "aaSorting": [
               [4, 'asc'],
               [5, 'asc']
          ],
          "language": {
               "lengthMenu": "Demonstrar _MENU_ linhas por páginas",
               "zeroRecords": "Não existe registros a demonstrar ...",
               "info": "Mostrada página _PAGE_ de _PAGES_",
               "infoEmpty": "Sem registros na produtividade ...",
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

     $('#men-2').css('height', $('#men-3').height() + 'px');

     $("#mos_t").click(function() {
          $('#tel_c').fadeToggle();
          $('#men-2').css('height', $('#men-3').height() + 'px');
     });

     $("#fun").change(function() {
          let ope = 2;
          let cod = $("#fun").val();
          $.getJSON("ajax/fun-car-dados.php", {
                    tip: 5,
                    ope: ope,
                    cod: cod
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#car').val(data.hor);
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados do funcionário");
               });
     });

     $("#dat").blur(function() {
          if ($("#dat").val() == "") {
               var dat = new Date;
               var ddd = ('0' + dat.getDate()).slice(-2);
               var mmm = ('0' + (dat.getMonth() + 1)).slice(-2);
               var aaa = dat.getFullYear();
               dat = ddd + "/" + mmm + "/" + (parseFloat(aaa, 10) + 5);
               $('#dat').val(dat);
          }
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

     if (isset($_SESSION['wrkmesano']) == false) { $_SESSION['wrkmesano'] = ""; }
     if (isset($_REQUEST['mes_p']) == true) { $_SESSION['wrkmesano'] = $_REQUEST['mes_p']; }

     if ($_SESSION['wrkopereg'] == 3) { 
          $bot = 'Deletar'; 
          $del = "cor-2";
          $per = ' onclick="return confirm(\'Confirma exclusão de produtividade informada em tela ?\')" ';
     }  

     if ($_SESSION['wrkopereg'] == 2 || $_SESSION['wrkopereg'] == 3) {
          if (isset($_REQUEST['salvar']) == false) { 
               $cha = $_SESSION['wrkcodreg']; $_SESSION['wrknumcha'] = $_SESSION['wrkcodreg']; 
               $ret = ler_producao($_SESSION['wrkcodreg']); 
          }
     }

     if (isset($_REQUEST['salvar']) == true) {
          if ($_SESSION['wrkopereg'] == 1) {
               $ret = consiste_pro();
               if ($ret == 0) {
                    $ret = incluir_pro();
                    $ret = gravar_log(11,"Inclusão de nova produtividade: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-producao.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 2) {
               $ret = consiste_pro();
               if ($ret == 0) {
                    $ret = alterar_pro();
                    $ret = gravar_log(12,"Alteração de produtividade existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-producao.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 3) {
               $ret = excluir_pro();
               $ret = gravar_log(13,"Exclusão de produtividade existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
               exit('<script>location.href = "man-producao.php?ope=1&cod=0"</script>'); 
          }
     }

?>

<body id="box00">
     <div class="container-fluid">
          <div class="row">
               <div id="men-2" class="cab-a col-md-2">
                    <?php include_once "cabecalho-2.php"; ?>
               </div>
               <div id="men-3" class="col-md-10">
                    <br />
                    <div class="row">
                         <div class="col-md-10">
                              <h3 class="cor-4"><strong>Manutenção em Produtividade</strong></h3>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="mos_t" href="#"
                                   title="Mostra e esconde a página detalhada com os dados de banco de horas para edição.">
                                   <i class="fa fa-eye fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a href="man-producao.php?ope=1&cod=0"
                                   title="Abre página para adicionar (criar) mais um registro de banco dentro do sistema.">
                                   <i class="fa fa-plus-circle fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                    </div>
                    <br />
                    <form id="frmTelMan" name="frmTelMan" action="man-producao.php" method="POST">
                         <div id="tel_c" class="qua-2">
                              <div class="row">
                                   <div class="col-md-2">
                                        <label>Código</label>
                                        <input type="text" class="form-control text-center" maxlength="6" id="cod"
                                             name="cod" value="<?php echo $_SESSION['wrkcodreg']; ?>" disabled />
                                   </div>
                                   <div class="col-md-4">
                                        <label>Assunto (Produtividade)</label>
                                        <select id="ass" name="ass" class="form-control">
                                             <?php $ret = carrega_ass(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-4">
                                        <label>Nome do Funcionário</label>
                                        <select id="fun" name="fun" class="form-control">
                                             <?php $ret = carrega_col(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-2">
                                        <label>Status</label>
                                        <select name="sta" class="form-control">
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
                                   <div class="col-md-2">
                                        <label>Data</label>
                                        <input type="text" class="form-control text-center" maxlength="10" id="dat"
                                             name="dat"
                                             value="<?php echo (isset($_REQUEST['dat']) == false ? "" : $_REQUEST['dat']); ?>" />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Quantidade</label>
                                        <input type="text" class="form-control text-center" maxlength="5" id="qtd"
                                             name="qtd"
                                             value="<?php echo (isset($_REQUEST['qtd']) == false ? "" : $_REQUEST['qtd']); ?>" />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Tipo</label>
                                        <select name="tip" class="form-control">
                                             <option value="0"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 0 ? '' : 'selected="selected"'); ?>>
                                                  Normal
                                             </option>
                                             <option value="1"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 1 ? '' : 'selected="selected"'); ?>>
                                                  Folga</option>
                                             <option value="2"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 2 ? '' : 'selected="selected"'); ?>>
                                                  Férias</option>
                                             <option value="3"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 3 ? '' : 'selected="selected"'); ?>>
                                                  Afastamento Médico</option>
                                             <option value="4"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 4 ? '' : 'selected="selected"'); ?>>
                                                  Licença Médica</option>
                                             <option value="5"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 5 ? '' : 'selected="selected"'); ?>>
                                                  Trabalho Interno</option>
                                             <option value="6"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 6 ? '' : 'selected="selected"'); ?>>
                                                  Dupla</option>
                                             <option value="7"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 7 ? '' : 'selected="selected"'); ?>>
                                                  Falta sem Justificar</option>
                                             <option value="8"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 8 ? '' : 'selected="selected"'); ?>>
                                                  Divulgação Externa</option>
                                             <option value="9"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 9 ? '' : 'selected="selected"'); ?>>
                                                  Treinamentos e Cursos</option>
                                             <option value="10"
                                                  <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 10 ? '' : 'selected="selected"'); ?>>
                                                  Dupla na Expansão</option>
                                        </select>
                                   </div>
                                   <div class="col-md-6">
                                        <label>Observação</label>
                                        <textarea class="form-control" rows="5" id="obs"
                                             name="obs"><?php echo (isset($_REQUEST['obs']) == false ? "" : $_REQUEST['obs']); ?></textarea>
                                   </div>
                              </div>
                              <br />
                              <div class="row text-center">
                                   <div class="col-md-5"></div>
                                   <div class="col-md-2">
                                        <button type="submit" name="salvar" <?php echo $per; ?>
                                             class="bot-1 <?php echo $del; ?>"><?php echo $bot; ?></button>
                                   </div>
                                   <div class="col-md-3"></div>
                              </div>
                              <br />
                         </div>
                         <br />
                         <div class="row qua-4">
                              <div class="col-md-2">
                                   <label>Assunto</label>
                                   <select id="ass_p" name="ass_p" class="form-control">
                                        <?php $ret = carrega_ass(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2">
                                   <label>Setor</label>
                                   <select id="set_p" name="set_p" class="form-control">
                                        <?php $ret = carrega_set(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2">
                                   <label>Cargo</label>
                                   <select id="car_p" name="car_p" class="form-control">
                                        <?php $ret = carrega_car(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2">
                                   <label>Função</label>
                                   <select id="fun_p" name="fun_p" class="form-control">
                                        <?php $ret = carrega_fun(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2">
                                   <label>Mês e Ano</label>
                                   <input type="text" class="form-control text-center" maxlength="7" id="mes_p"
                                        name="mes_p" value="<?php echo $_SESSION['wrkmesano']; ?>" />
                              </div>
                              <div class="col-md-2 text-center"><br />
                                   <button type="button" class="bot-2" id="pes_f" name="pes_f">
                                        <i class="fa fa-search fa-3x" aria-hidden="true"></i>
                                   </button>
                              </div>
                         </div>
                    </form>
                    <hr />
                    <div class="container-fluid">
                         <div class="row">
                              <div class="tab-1 table-responsive">
                                   <table id="tab-0" class="table table-sm table-striped">
                                        <thead>
                                             <tr>
                                                  <th width="2%" class="text-center">Alterar</th>
                                                  <th width="2%" class="text-center">Excluir</th>
                                                  <th width="2%" class="text-center">Número</th>
                                                  <th>Status</th>
                                                  <th>Assunto</th>
                                                  <th>Nome do Funcionário</th>
                                                  <th>Data</th>
                                                  <th>Semana</th>
                                                  <th>Tipo</th>
                                                  <th>Quantidade</th>
                                                  <th>Observação</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             <?php $ret = carrega_pro();  ?>
                                        </tbody>
                                   </table>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     </div>
     <div class="row">
          <img class="subir" src="img/subir.png" />
     </div>
</body>
<?php
function ultimo_cod() {
     $cod = 1;
     include_once "dados.php";
     $nro = acessa_reg('Select idproducao from tb_producao order by idproducao desc Limit 1', $reg);
     if ($nro == 1) {
          $cod = $reg['idproducao'] + 1;
     }        
     return $cod;
}

function carrega_set() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione setor ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 2 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
     }
     return $sta;
}

function carrega_col() {
     $sta = 0;
     include_once "dados.php";    
     $fun = (isset($_REQUEST['fun']) == false ? "" : $_REQUEST['fun']);
     echo '<option value="0" selected="selected">Selecione funcionário ...</option>';
     $com = "Select idfuncionario, funnome from tb_funcionario order by funnome, idfuncionario";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['idfuncionario'] != $fun) {
               echo  '<option value ="' . $lin['idfuncionario'] . '">' . $lin['funnome'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['idfuncionario'] . '" selected="selected">' . $lin['funnome'] . '</option>';
          }
     }
     return $sta;
}

function carrega_ass() {
     $sta = 0;
     include_once "dados.php";    
     $ass = (isset($_REQUEST['ass']) == false ? "" : $_REQUEST['ass']);
     echo '<option value="0" selected="selected">Selecione assunto ...</option>';
     $com = "Select idassunto, assdescricao from tb_assunto where assstatus = 0 order by assdescricao, idassunto";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['idassunto'] != $ass) {
               echo  '<option value ="' . $lin['idassunto'] . '">' . $lin['assdescricao'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['idassunto'] . '" selected="selected">' . $lin['assdescricao'] . '</option>';
          }
     }
     return $sta;
}

function carrega_car() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione cargo ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 3 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
     }
     return $sta;
}

function carrega_fun() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione função ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 1 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
     }
     return $sta;
}

function carrega_pro() {
     $ret = 0;
     include_once "dados.php";
     $com = "Select P.*, A.assdescricao, F.funnome, F.funcargo, F.funsetor, F.funfuncao from ((tb_producao P left join tb_funcionario F on P.profuncionario = F.idfuncionario) left join tb_assunto A on P.proassunto = A.idassunto) where idproducao > 0 ";
     if (isset($_REQUEST['set_p']) == true) {
          if ($_REQUEST['ass_p'] != 0) { $com .= " and P.proassunto = " . $_REQUEST['ass_p']; }
          if ($_REQUEST['set_p'] != 0) { $com .= " and F.funsetor = " . $_REQUEST['set_p']; }
          if ($_REQUEST['car_p'] != 0) { $com .= " and F.funcargo = " . $_REQUEST['car_p']; }
          if ($_REQUEST['fun_p'] != 0) { $com .= " and F.funfuncao = " . $_REQUEST['fun_p']; }
          if ($_REQUEST['mes_p'] != "") { 
               $mes_p = substr($_REQUEST['mes_p'], 3, 4) . '-' . substr($_REQUEST['mes_p'], 0, 2);
               $com .= " and date_format(P.prodata, '%Y-%m') = '" . $mes_p . "'";
          }
     }
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          $txt =  '<tr>';
          $txt .= '<td class="text-center"><a href="man-producao.php?ope=2&cod=' . $lin['idproducao'] . '" title="Efetua alteração do registro informado na linha"><i class="large material-icons">healing</i></a></td>';
          $txt .= '<td class="text-center"><a href="man-producao.php?ope=3&cod=' . $lin['idproducao'] . '" title="Efetua alteração do registro informado na linha"><i class="cor-1 large material-icons">delete_forever</i></a></td>';
          $txt .= '<td class="text-center">' . $lin['idproducao'] . '</td>';
          if ($lin['prostatus'] == 0) {$txt .= "<td>" . "Normal" . "</td>";}
          if ($lin['prostatus'] == 1) {$txt .= "<td>" . "Bloqueado" . "</td>";}
          if ($lin['prostatus'] == 2) {$txt .= "<td>" . "Suspenso" . "</td>";}
          if ($lin['prostatus'] == 3) {$txt .= "<td>" . "Cancelado" . "</td>";}
          $txt .= '<td>' . $lin['assdescricao'] . '</td>';
          $txt .= '<td>' . $lin['funnome'] . '</td>';
          $txt .= '<td class="text-center">' . date('d/m/Y', strtotime($lin['prodata'])) . '</td>';
          $txt .= '<td class="text-center">' . semana_dia($lin['prodata']) . '</td>';
          $txt .= '<td class="text-center">' . $lin['profolga'] . '</td>';
          $txt .= '<td class="text-center">' .  number_format($lin['proquantidade'], 0, ".", ",")  . '</td>';
          $txt .= '<td>' . $lin['proobservacao'] . '</td>';
          $txt .= "</tr>";
          echo $txt;
     }
     return $ret;
}

function consiste_pro() {
     $sta = 0;
     if (trim($_REQUEST['dat']) == "") {
          echo '<script>alert("Data do Movimento não pode estar em branco");</script>';
          return 1;
     }
     if (trim($_REQUEST['fun']) == "" || trim($_REQUEST['fun']) == "0") {
          echo '<script>alert("Nome do Funcionário não pode estar zerado");</script>';
          return 1;
     }
     if (trim($_REQUEST['qtd']) == "" || trim($_REQUEST['qtd']) == "0") {
          echo '<script>alert("Quantidade de Movimentio não pode estar zerado");</script>';
          return 1;
     }
     if (trim($_REQUEST['dat']) != "") {
          if (valida_dat($_REQUEST['dat']) != 0) {
               echo '<script>alert("Data de Movimento informada no usuário não é valida");</script>';
               return 1;
          }
     }
     return $sta;
}

function ler_producao(&$cha) {
     include_once "dados.php";
     $nro = acessa_reg('Select * from tb_producao where idproducao = ' . $cha, $reg);
     if ($nro == 0 || $reg == false) {
          echo '<script>alert("Código da Função informada não cadastrada");</script>';
          $nro = 1;
     } else {
          $_REQUEST['sta'] = $reg['prostatus'];
          $_REQUEST['tip'] = $reg['protipo'];
          $_REQUEST['fun'] = $reg['profuncionario'];
          $_REQUEST['ass'] = $reg['proassunto'];
          $_REQUEST['dat'] = date('d/m/Y', strtotime($reg['prodata']));
          $_REQUEST['qtd'] = number_format($reg['proquantidade'], 0, ".", ",");
          $_REQUEST['obs'] = $reg['proobservacao'];
     }
     return $cha;
}

function incluir_pro() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "insert into tb_producao (";
     $sql .= "prostatus, ";
     $sql .= "protipo, ";
     $sql .= "profuncionario, ";
     $sql .= "proassunto, ";
     $sql .= "prodata, ";
     $sql .= "proquantidade, ";
     $sql .= "proobservacao, ";
     $sql .= "keyinc, ";
     $sql .= "datinc ";
     $sql .= ") value ( ";
     $sql .= "'" . $_REQUEST['sta'] . "',";
     $sql .= "'" . $_REQUEST['tip'] . "',";
     $sql .= "'" . $_REQUEST['fun'] . "',";
     $sql .= "'" . $_REQUEST['ass'] . "',";
     $sql .= "'" . inverte_dat(0, $_REQUEST['dat']) . "',";
     $sql .= "'" . $_REQUEST['qtd'] . "',";
     $sql .= "'" . $_REQUEST['obs'] . "',";
     $sql .= "'" . $_SESSION['wrkideusu'] . "',";
     $sql .= "'" . date("Y/m/d H:i:s") . "')";
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na gravação do registro solicitado !");</script>';
     }
     return $ret;
 }

 function alterar_pro() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "update tb_producao set ";
     $sql .= "prostatus = '". $_REQUEST['sta'] . "', ";
     $sql .= "protipo = '". $_REQUEST['tip'] . "', ";
     $sql .= "profuncionario = '". trim($_REQUEST['fun']) . "', ";
     $sql .= "proassunto = '". trim($_REQUEST['ass']) . "', ";
     $sql .= "prodata = '". inverte_dat(0, $_REQUEST['dat']) . "', ";
     $sql .= "proquantidade = '". $_REQUEST['qtd'] . "', ";
     $sql .= "proobservacao = '". trim($_REQUEST['obs']) . "', ";
     $sql .= "keyalt = '" . $_SESSION['wrkideusu'] . "', ";
     $sql .= "datalt = '" . date("Y/m/d H:i:s") . "' ";
     $sql .= "where idproducao = " . $_SESSION['wrkcodreg'];
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na regravação do registro solicitado !");</script>';
     }
     return $ret;
}

function excluir_pro() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "Delete from tb_producao where idproducao = " . $_SESSION['wrkcodreg'] ;
     $ret = comando_tab($sql, $nro, $cha, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na exclusão do registro solicitado !");</script>';
     }
     return $ret;
}

?>

</html>