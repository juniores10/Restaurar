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
     <title>Documentos - Gerenciamento de Colaboradores</title>
</head>

<script>
$(document).ready(function() {
     if (localStorage.doc_p == undefined) {
          $('#tel_c').hide();
          localStorage.setItem('doc_p', 1);
     }

     $('#tab-0').DataTable({
          "pageLength": 50,
          "aaSorting": [
               [2, 'asc']
          ],
          "language": {
               "lengthMenu": "Demonstrar _MENU_ linhas por páginas",
               "zeroRecords": "Não existe registros a demonstrar ...",
               "info": "Mostrada página _PAGE_ de _PAGES_",
               "infoEmpty": "Sem registros de documentos ...",
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

     $('#upl_b').bind("click", function() {
          $('#doc_j').click();
     });

     $('#doc_j').change(function() {
          var cam = $('#doc_j').val();
          $('#lit_b').text(cam.replace(/^.*\\/, ""));
          arq_f = new FormData();
          arq_f.append('arq-imp', $('#doc_j').prop('files')[0]);
          $.ajax({
               url: 'ajax/doc-pdf-upload.php?cam=' + cam,
               data: arq_f,
               dataType: 'json',
               processData: false,
               contentType: false,
               type: 'POST',
               success: function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#ope_i').val(1);
                    }
               },
               error: function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert(
                         "Erro ocorrido no processamento de Upload de arquivo solicitado"
                    );
               }
          });
     });

     $(".docto").click(function() {
          var cam = $(this).attr("cam");
          $('#doc-p').attr('src', cam);
          $('#doc-pdf').modal('show');
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
          $per = ' onclick="return confirm(\'Confirma exclusão de docto informado em tela ?\')" ';
     }  

     if ($_SESSION['wrkopereg'] == 2 || $_SESSION['wrkopereg'] == 3) {
          if (isset($_REQUEST['salvar']) == false) { 
               $cha = $_SESSION['wrkcodreg']; $_SESSION['wrknumcha'] = $_SESSION['wrkcodreg']; 
               $ret = ler_docto($_SESSION['wrkcodreg']); 
          }
     }

     if (isset($_REQUEST['salvar']) == true) {
          if ($_SESSION['wrkopereg'] == 1) {
               $ret = consiste_doc();
               if ($ret == 0) {
                    $ret = incluir_doc();
                    $ret = gravar_log(11,"Inclusão de novo docto: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-docto.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 2) {
               $ret = consiste_doc();
               if ($ret == 0) {
                    $ret = alterar_doc();
                    $ret = gravar_log(12,"Alteração de docto existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-docto.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 3) {
               $ret = excluir_doc();
               $ret = gravar_log(13,"Exclusão de docto existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
               exit('<script>location.href = "man-docto.php?ope=1&cod=0"</script>'); 
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
                              <h3 class="cor-4"><strong>Manutenção de Documentos</strong></h3>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="mos_t" href="#"
                                   title="Mostra e esconde a página detalhada com os dados de documentos para edição.">
                                   <i class="fa fa-eye fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a href="man-docto.php?ope=1&cod=0"
                                   title="Abre página para adicionar (criar) mais um documento dentro do sistema.">
                                   <i class="fa fa-plus-circle fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                    </div>
                    <br />
                    <form id="frmTelMan" name="frmTelMan" action="man-docto.php" method="POST"
                         enctype="multipart/form-data">
                         <div class="qua-2" id="tel_c">
                              <div class="row">
                                   <div class="col-md-2">
                                        <label>Número</label>
                                        <input type="text" class="form-control text-center" maxlength="6" id="cod"
                                             name="cod" value="<?php echo $_SESSION['wrkcodreg']; ?>" disabled />
                                   </div>
                                   <div class="col-md-8">
                                        <label>Descrição do Documento</label>
                                        <input type="text" class="form-control" maxlength="50" id="des" name="des"
                                             value="<?php echo (isset($_REQUEST['des']) == false ? "" : $_REQUEST['des']); ?>"
                                             required />
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
                                   <div class="col-md-3">
                                        <label>Tipo de Docto</label>
                                        <select id="tip" name="tip" class="form-control">
                                             <?php $ret = carrega_tip(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-3">
                                        <label>Setor</label>
                                        <select id="set" name="set" class="form-control">
                                             <?php $ret = carrega_set(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-3">
                                        <label>Função</label>
                                        <select id="fun" name="fun" class="form-control">
                                             <?php $ret = carrega_fun(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-3">
                                        <label>Nome do Funcionário</label>
                                        <select id="col" name="col" class="form-control">
                                             <?php $ret = carrega_col(); ?>
                                        </select>
                                   </div>
                              </div>
                              <div class="row">
                                   <div class="col-md-10">
                                        <label>Observação para o Documento</label>
                                        <textarea class="form-control" rows="2" id="obs"
                                             name="obs"><?php echo (isset($_REQUEST['obs']) == false ? "" : $_REQUEST['obs']); ?></textarea>
                                   </div>
                                   <div class="col-md-2 text-left"><br />
                                        <input type="checkbox" id="vis" name="vis" value="1"
                                             <?php echo (isset($_REQUEST['vis']) == false ? "" : 'checked'); ?> />
                                        <span>&nbsp; Dar Visto</span> 
                                        <br />
                                        <input type="checkbox" id="tod" name="tod" value="1"
                                             <?php echo (isset($_REQUEST['tod']) == false ? "" : 'checked'); ?> />
                                        <span>&nbsp;Para Todos</span> 
                                   </div>
                              </div>
                              <br />
                              <div class="row text-center">
                                   <div class="col-md-5"></div>
                                   <div class="col-md-2">
                                        <button type="submit" name="salvar" <?php echo $per; ?>
                                             class="bot-1 <?php echo $del; ?>"><?php echo $bot; ?></button>
                                   </div>
                                   <div class="col-md-4"></div>
                                   <div class="col-md-1">
                                        <i id="upl_b" class="cur-1 cor-1 fa fa-cloud-upload fa-3x"
                                             aria-hidden="true"></i>
                                   </div>
                              </div>
                              <br />
                              <input type="file" id="doc_j" class="bot-3" accept=".pdf, .PDF" />
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
                                                       <th width="2%" class="text-center">Alterar</th>
                                                       <th width="2%" class="text-center">Excluir</th>
                                                       <th width="2%" class="text-center">Código</th>
                                                       <th>Status</th>
                                                       <th>Descrição do Documento</th>
                                                       <th>Local</th>
                                                       <th>Setor</th>
                                                       <th>Função</th>
                                                       <th>Funcionário</th>
                                                       <th class="text-center">Visto</th>
                                                       <th>Observação</th>
                                                       <th>Inclusão</th>
                                                       <th>Alteração</th>
                                                       <th class="text-center">Docto</th>
                                                  </tr>
                                             </thead>
                                             <tbody>
                                                  <?php $ret = carrega_doc();  ?>
                                             </tbody>
                                        </table>
                                   </div>
                              </div>
                         </div>
                    </form>
               </div>
               <div class="row">
                    <img class="subir" src="img/subir.png" />
               </div>
          </div>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="modal fade" id="doc-pdf" tabindex="-1" role="dialog" aria-labelledby="tel-pdf" aria-hidden="true"
               data-backdrop="true">
               <div class="modal-dialog modal-xl" role="document">
                    <!-- modal-sm modal-lg modal-xl -->
                    <form id="frmMosFot" name="frmMosFot" action="man-docto.php" method="POST">
                         <div class="modal-content">
                              <div class="modal-header bg-primary text-white">
                                   <h5 class="modal-title" id="tel-pdf">Demonstração de Documento</h5>
                                   <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                        <span aria-hidden="true">&times;</span>
                                   </button>
                              </div>
                              <div class="modal-body">
                                   <div class="form-row text-center">
                                        <div class="col-md-12">
                                             <embed id="doc-p" src="" width="1110" height="750" type='application/pdf'>
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
     </div>
</body>
<?php
function ultimo_cod() {
     $cod = 1;
     include_once "dados.php";
     $nro = acessa_reg('Select iddocto from tb_docto order by iddocto desc Limit 1', $reg);
     if ($nro == 1) {
          $cod = $reg['iddocto'] + 1;
     }        
     return $cod;
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

function carrega_tip() {
     $sta = 0;
     include_once "dados.php"; 
     $tip = (isset($_REQUEST['tip']) == false ? "" : $_REQUEST['tip']);   
     echo '<option value="0" selected="selected">Selecione tipo docto desejado ...</option>';
     $com = "Select iddocto, docdescricao from tb_tipodoc where docstatus = 0 order by docdescricao, iddocto";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['iddocto'] != $tip) {
               echo  '<option value ="' . $lin['iddocto'] . '">' . $lin['docdescricao'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['iddocto'] . '" selected="selected">' . $lin['docdescricao'] . '</option>';
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

function carrega_doc() {
     $ret = 0;
     include_once "dados.php";
     $com = "Select D.*, F.funlocal from (tb_docto D left join tb_funcionario F on D.docfuncionario = F.idfuncionario) where iddocto > 0 ";
     if (isset($_REQUEST['set_p']) == true) {
          if ($_REQUEST['loc_p'] != 0) {$com .= " and funlocal = " . $_REQUEST['loc_p'];}
          if ($_REQUEST['set_p'] != 0) {$com .= " and docsetor = " . $_REQUEST['set_p'];}
          if ($_REQUEST['fun_p'] != 0) {$com .= " and docfuncao = " . $_REQUEST['fun_p'];}
     }
     $com .= " order by docdescricao, iddocto";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          $txt =  '<tr>';
          $txt .= '<td class="text-center"><a href="man-docto.php?ope=2&cod=' . $lin['iddocto'] . '" title="Efetua alteração do registro informado na linha"><i class="large material-icons">healing</i></a></td>';
          $txt .= '<td class="text-center"><a href="man-docto.php?ope=3&cod=' . $lin['iddocto'] . '" title="Efetua alteração do registro informado na linha"><i class="cor-1 large material-icons">delete_forever</i></a></td>';
          $txt .= '<td class="text-center">' . $lin['iddocto'] . '</td>';
          if ($lin['docstatus'] == 0) {$txt .= "<td>" . "Normal" . "</td>";}
          if ($lin['docstatus'] == 1) {$txt .= "<td>" . "Bloqueado" . "</td>";}
          if ($lin['docstatus'] == 2) {$txt .= "<td>" . "Suspenso" . "</td>";}
          if ($lin['docstatus'] == 3) {$txt .= "<td>" . "Cancelado" . "</td>";}
          $txt .= '<td>' . $lin['docdescricao'] . '</td>';
          $txt .= '<td>' . retorna_dad('locfantasia', 'tb_local', 'idlocal', $lin['funlocal']) . '</td>';
          $txt .= '<td>' . retorna_inf('daddescricao', 2, 'iddados', $lin['docsetor']) . '</td>';
          $txt .= '<td>' . retorna_inf('daddescricao', 1, 'iddados', $lin['docfuncao']) . '</td>';
          $txt .= '<td>' . retorna_dad('funnome', 'tb_funcionario', 'idfuncionario', $lin['docfuncionario']) . '</td>';
          $txt .= '<td class="text-center">' . ($lin['docvisto'] == 1 ? 'Sim' : 'Não') . '</td>';
          $txt .= '<td>' . $lin['docobservacao'] . '</td>';
          $txt .= '<td>' . date('d/m/Y H:i:s', strtotime($lin['datinc'])) . '</td>';
          if ($lin['datalt']  == null) {
               $txt .= '<td>' . '' . '</td>';
          } else {
               $txt .= '<td>' . date('d/m/Y H:i:s', strtotime($lin['datalt'])) . '</td>';
          }
          $cam = existe_doc($lin['iddocto']);
          if ($cam == "") {
               $txt .= '<td class="text-center">' . '<i class="cur-2 fa fa-file-pdf-o fa-3x" aria-hidden="true"></i>' . '</td>';
          } else {
               $txt .= '<td class="text-center">' . '<i class="docto cur-1 cor-3 fa fa-file-pdf-o fa-3x" aria-hidden="true" cam=' . $cam . '></i>' . '</td>';
          }
          $txt .= "</tr>";
          echo $txt;
     }
     return $ret;
}

function consiste_doc() {
     $sta = 0;
     if (trim($_REQUEST['des']) == "") {
          echo '<script>alert("Descrição do Docto não pode estar em branco");</script>';
          return 1;
     }
     return $sta;
}

function ler_docto(&$cha) {
     include_once "dados.php";
     $nro = acessa_reg('Select * from tb_docto where iddocto = ' . $cha, $reg);
     if ($nro == 0 || $reg == false) {
          echo '<script>alert("Código do Docto informado não cadastrado");</script>';
          $nro = 1;
     } else {
          $_REQUEST['sta'] = $reg['docstatus'];
          $_REQUEST['des'] = $reg['docdescricao'];
          $_REQUEST['set'] = $reg['docsetor'];
          $_REQUEST['tip'] = $reg['doctipo'];
          $_REQUEST['fun'] = $reg['docfuncao'];
          $_REQUEST['col'] = $reg['docfuncionario'];
          $_REQUEST['obs'] = $reg['docobservacao'];
          if ($reg['docvisto'] == 1) { $_REQUEST['vis'] = $reg['docvisto'];}
          if ($reg['doctodos'] == 1) { $_REQUEST['tod'] = $reg['doctodos'];}
     }
     return $cha;
}

function incluir_doc() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "insert into tb_docto (";
     $sql .= "docstatus, ";
     $sql .= "docdescricao, ";
     $sql .= "docvisto, ";
     $sql .= "doctodos, ";
     $sql .= "docsetor, ";
     $sql .= "doctipo, ";
     $sql .= "docfuncao, ";
     $sql .= "docfuncionario, ";
     $sql .= "docobservacao, ";
     $sql .= "keyinc, ";
     $sql .= "datinc ";
     $sql .= ") value ( ";
     $sql .= "'" . $_REQUEST['sta'] . "',";
     $sql .= "'" . trim($_REQUEST['des']) . "',";
     $sql .= "'" . (isset($_REQUEST['vis']) == false ? 0 : 1) . "',";
     $sql .= "'" . (isset($_REQUEST['tod']) == false ? 0 : 1) . "',";
     $sql .= "'" . trim($_REQUEST['set']) . "',";
     $sql .= "'" . trim($_REQUEST['tip']) . "',";
     $sql .= "'" . trim($_REQUEST['fun']) . "',";
     $sql .= "'" . trim($_REQUEST['col']) . "',";
     $sql .= "'" . trim($_REQUEST['obs']) . "',";
     $sql .= "'" . $_SESSION['wrkideusu'] . "',";
     $sql .= "'" . date("Y/m/d H:i:s") . "')";
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na gravação do registro solicitado !");</script>';
     }
     return $ret;
 }

 function alterar_doc() {
     $ret = 0; 
     include_once "dados.php";
     $ass_d = retorna_dad('docopcaoass', 'tb_docto', 'iddocto', $_SESSION['wrkcodreg']);
     $sql  = "update tb_docto set ";
     $sql .= "docstatus = '". $_REQUEST['sta'] . "', ";
     $sql .= "docvisto = '". (isset($_REQUEST['vis']) == false ? 0 : 1) . "', ";
     $sql .= "doctodos = '". (isset($_REQUEST['tod']) == false ? 0 : 1) . "', ";
     $sql .= "docdescricao = '". trim($_REQUEST['des']) . "', ";
     $sql .= "docsetor = '". trim($_REQUEST['set']) . "', ";
     $sql .= "doctipo = '". trim($_REQUEST['tip']) . "', ";
     $sql .= "docfuncao = '". trim($_REQUEST['fun']) . "', ";
     $sql .= "docfuncionario = '". trim($_REQUEST['col']) . "', ";
     $sql .= "docobservacao = '". trim($_REQUEST['obs']) . "', ";
     if ($ass_d == '1') { $sql .= "docopcaoass = '". '2' . "', "; }
     $sql .= "keyalt = '" . $_SESSION['wrkideusu'] . "', ";
     $sql .= "datalt = '" . date("Y/m/d H:i:s") . "' ";
     $sql .= "where iddocto = " . $_SESSION['wrkcodreg'];
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na regravação do registro solicitado !");</script>';
     }
     return $ret;
}

function excluir_doc() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "Delete from tb_docto where iddocto = " . $_SESSION['wrkcodreg'] ;
     $ret = comando_tab($sql, $nro, $cha, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na exclusão do registro solicitado !");</script>';
     }
     return $ret;
}

?>

</html>